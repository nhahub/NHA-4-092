import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRoad } from "@fortawesome/free-solid-svg-icons";

export default function AppLogo({ showText = true, size = 55 }) {
    const [imgError, setImgError] = useState(false);

    return (
        <>
            <div className="navbar-logo-icon">
                {imgError ? (
                    <FontAwesomeIcon icon={faRoad} style={{ fontSize: size }} />
                ) : (
                    <img
                        src="/AppLogo.png"
                        alt="Rhodes"
                        width={size}
                        height={size}
                        style={{
                            objectFit: "cover",    // Fills the allocated width/height completely
                            borderRadius: "50%",   // Crops the square background into a perfect circle
                            display: "block"       // Prevents weird inline-block spacing issues
                        }}
                        onError={() => setImgError(true)}
                    />
                )}
            </div>
            {showText && <span className="navbar-logo-text">Rhodes</span>}
        </>
    );
}