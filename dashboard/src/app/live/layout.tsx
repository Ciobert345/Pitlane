import type { ReactNode } from "react";

export default function LiveLayout({ children }: { children: ReactNode }) {
    return (
        <div className="h-full w-full overflow-hidden bg-black">
            {children}
        </div>
    );
}
