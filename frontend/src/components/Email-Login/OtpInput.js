import React, { useState, useRef, useEffect } from 'react';

const style = {
    otpInput: {
        width: '40px',
        height: '40px',
        border: '1px solid #ccc',
        margin: '5px',
        fontSize: '1.2em',
    },
};

const OtpInput = ({ otpLength = 4, onOtpSubmit }) => {
    const [otp, setOtp] = useState(new Array(otpLength).fill(''));
    const inputRef = useRef([]);

    useEffect(() => {
        if (inputRef.current[0]) {
            inputRef.current[0].focus();
        }
    }, []);

    const handleOtpChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        // Take only the last entered digit
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < otpLength - 1) {
            inputRef.current[index + 1].focus();
        }

        // Check if OTP is complete and call submit callback
        const otpValue = newOtp.join('');
        if (otpValue.length === otpLength && onOtpSubmit) {
            onOtpSubmit(otpValue);
        }
    };

    const handleClick = (index) => {
        inputRef.current[index].select();

        if (index > 0 && !otp[index - 1]) {
            inputRef.current[index - 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            // Focus previous input when backspace is pressed on empty input
            inputRef.current[otp.indexOf('')].focus();
        }
    };

    return (
        <div className="d-flex justify-content-center">
            {otp.map((value, index) => (
                <input
                    type="text"
                    ref={(input) => (inputRef.current[index] = input)}
                    key={index}
                    value={value}
                    onChange={(e) => handleOtpChange(e, index)}
                    onClick={() => handleClick(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="form-control mx-1"
                    style={style.otpInput}
                    maxLength={1}
                />
            ))}
        </div>
    );
};

export default OtpInput;
