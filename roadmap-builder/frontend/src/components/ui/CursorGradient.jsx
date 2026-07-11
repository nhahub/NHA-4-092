import { useEffect, useState } from "react";
import "./CursorGradient.css";

export default function CursorGradient() {
    const [trail, setTrail] = useState([]);

    useEffect(() => {
        function handleMouseMove(event) {
            const newDot = {
                id: Date.now(),
                x: event.clientX,
                y: event.clientY,
            };

            setTrail((oldTrail) => [...oldTrail.slice(-8), newDot]);

            setTimeout(() => {
                setTrail((oldTrail) => oldTrail.filter((dot) => dot.id !== newDot.id));
            }, 700);
        }

        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <div className="cursor-trail-area">
            {trail.map((dot, index) => (
                <div
                    key={dot.id}
                    className="cursor-trail-dot"
                    style={{
                        left: dot.x,
                        top: dot.y,
                        opacity: (index + 1) / trail.length,
                    }}
                />
            ))}
        </div>
    );
}