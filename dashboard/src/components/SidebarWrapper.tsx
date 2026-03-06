"use client";

import { useLiveData } from "@/contexts/LiveDataContext";
import Sidebar from "@/components/Sidebar";

export default function SidebarWrapper() {
    const { connected } = useLiveData();
    return (
        <div className="h-full">
            <Sidebar connected={connected} />
        </div>
    );
}
