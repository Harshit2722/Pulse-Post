import React from 'react';

const Avatar = ({ src, name, className = "" }) => {
    if (src) {
        return <img src={src} alt={name || "User"} className={`${className} object-cover`} />;
    }

    const initial = name ? name.charAt(0).toUpperCase() : '?';

    return (
        <div className={`${className} flex items-center justify-center bg-[#526D62] text-white font-bold uppercase shrink-0`}>
            {initial}
        </div>
    );
};

export default Avatar;
