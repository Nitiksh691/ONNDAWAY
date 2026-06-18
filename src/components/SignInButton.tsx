"use client";
import React, { useEffect } from 'react';

interface SignInButtonProps {
  onVerify: (user_json_url: string) => void;
}

const SignInButton = ({ onVerify }: SignInButtonProps) => {
    useEffect(() => {
        const container = document.querySelector('.pe_signin_button');
        if (!container) return;
        
        // Clean up previous script if any
        container.innerHTML = '';

        // Load the external script
        const script = document.createElement('script');
        script.src = "https://www.phone.email/sign_in_button_v1.js";
        script.async = true;
        container.appendChild(script);

        // Define the listener function
        (window as any).phoneEmailListener = function(userObj: any) {
            const user_json_url = userObj.user_json_url;
            onVerify(user_json_url);
        };

        return () => {
            (window as any).phoneEmailListener = null;
        };
    }, [onVerify]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '10px 0' }}>
           <div className="pe_signin_button" data-client-id="15695407177920574360"></div>
        </div>
    );
};

export default SignInButton;
