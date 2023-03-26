import { Color } from "@mui/material";
import React, { useState } from "react";
import ReactCodeInput from "react-code-input";
import { LoginID } from "../theme/theme";

interface CodeInputProps {
  inputName: string;
  validateCode: (e: string) => void;
}

export const CodeInput: React.FC<CodeInputProps> = ({
  inputName,
  validateCode,
}) => {
  const props = {
    inputStyle: {
      fontFamily: LoginID.typography.fontFamily,
      margin: "1px",
      borderRadius: "4px",
      fontSize: "14px",
      paddingLeft: "4px",
      paddingRight: 0,
      width: "32px",
      height: "32px",
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
      onChange={(e: string) => validateCode(e)}
      pattern="^[0-9]+$|^$"
      {...props}
    />
  );
};
