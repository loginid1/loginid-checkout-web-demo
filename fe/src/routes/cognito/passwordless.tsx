import { Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function CognitoPasswordless() {

    // handle code
	const [searchParams, setSearchParams] = useSearchParams();
    const [code, setCode] = useState("");
    useEffect(()=>{

        let acode=searchParams.get("code");
        if (acode){
            console.log(acode, window.location.pathname);
            setCode(acode);
        } else {

            let redirect_url = location.protocol + '//' + location.hostname + '/cognito/passwordless';
            let cognito_client = "4tpb9l8dar6h1pfjtv1a101qc4";
            let code_challenge = 'test';
            let oidc_url= `https://loginid-testnet.auth.us-east-2.amazoncognito.com/oauth2/authorize?response_type=code&client_id=${cognito_client}&scope=openid&state=12345&redirect_uri=${redirect_url}`;
            window.location.assign(oidc_url);

        }
        


    },[]);
    return (
        <div>
            {code &&
            <>
                <Typography variant="body1">got code back</Typography>
                <Button>Success</Button>
            </> 
            }
        </div>
    )
}