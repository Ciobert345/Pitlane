use anyhow::Error;
use serde_json::{Value, json};
use tokio::sync::broadcast::Sender;
use tokio_stream::StreamExt;
use tracing::{error, trace, warn, info};

use crate::services::state_service::StateService;

const URL: &str = "livetiming.formula1.com/signalr";
const HUB: &str = "Streaming";

const TOPICS: [&str; 15] = [
    "Heartbeat",
    "ExtrapolatedClock",
    "TimingStats",
    "TimingAppData",
    "WeatherData",
    "TrackStatus",
    "SessionStatus",
    "DriverList",
    "RaceControlMessages",
    "SessionInfo",
    "SessionData",
    "LapCount",
    "TimingData",
    "TeamRadio",
    "ChampionshipPrediction",
];

pub async fn ingest_f1(
    state_service: StateService,
    update_sender: Sender<String>,
) -> Result<(), Error> {
    let mut signalr_client = signalr::create_client(URL, HUB).await?;

    let initial = signalr::subscribe(&mut signalr_client, &TOPICS).await?;
    handle_initial(&state_service, initial).await?;

    let mut stream = signalr::listen(signalr_client);

    while let Some(items) = stream.next().await {
        for update in items {
            trace!(?update.topic, "Received data for topic");

            if update.topic == "SessionInfo" && update.data.pointer("/Name").is_some() {
                warn!("received SessionInfo event, restarting...");
                return Ok(());
            }

            match handle_update(&update_sender, &state_service, update.topic.clone(), update.data).await {
                Ok(_) => info!(topic = ?update.topic, "Handled SignalR update"),
                Err(err) => error!(?err, topic = ?update.topic, "failed to handle update"),
            };
        }
    }

    Ok(())
}

async fn handle_update(
    sender: &Sender<String>,
    state_service: &StateService,
    topic: String,
    update: Value,
) -> Result<(), Error> {
    // Normalize topics: "CarData.z" -> "CarDataZ", "Position.z" -> "PositionZ"
    let normalized_topic = topic.replace(".", "").replace("z", "Z");
    
    if normalized_topic == "SessionData" {
        info!(data = %update.to_string(), "Received SessionData update");
    }

    let update = json!({ &normalized_topic: update });

    match sender.send(update.to_string()) {
        Ok(_) => trace!(topic = ?normalized_topic, "sent update to realtime channel"),
        Err(err) => error!(?err, "failed to send update to realtime channel"),
    };

    state_service.update_state(update).await?;

    Ok(())
}

async fn handle_initial(state_service: &StateService, initial: Value) -> Result<(), Error> {
    if let Some(obj) = initial.as_object() {
        info!(keys = ?obj.keys().collect::<Vec<_>>(), "Received initial SignalR state");
    }
    
    let normalized_initial = if let Value::Object(map) = initial {
        let mut new_map = serde_json::Map::new();
        for (k, v) in map {
            let new_key = k.replace(".", "").replace("z", "Z");
            new_map.insert(new_key, v);
        }
        Value::Object(new_map)
    } else {
        initial
    };

    state_service.set_state(normalized_initial).await?;
    Ok(())
}
