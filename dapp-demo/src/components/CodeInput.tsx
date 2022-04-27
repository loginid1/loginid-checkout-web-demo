import { Color } from "@mui/material";
import React, { useState } from "react";
import ReactCodeInput from "react-code-input";
import { LoginID } from "../theme/theme";

interface CodeInputProps {
  inputName: string;
  validateCode: ((e: string) => void )
}

export const CodeInput: React.FC<CodeInputProps> = ({ inputName, validateCode }) => {
  const props = {
    inputStyle: {
      fontFamily: LoginID.typography.fontFamily,
      margin: "4px",
      borderRadius: "6px",
      fontSize: "14px",
      paddingLeft: "8px",
      paddingRight: 0,
      width: "37px",
      height: "40px",
      border: `1px solid ${LoginID.palette.primary.main}`,
      justifyContent: "center",
    },
  };

  return (
    <ReactCodeInput
      type="text"
      fields={6}
      name={inputName}
      inputMode="numeric"
      onChange={(e) => validateCode(e)}
      pattern="^[0-9]+$|^$"
      {...props}
    />
  );
};
