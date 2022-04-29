import { Box, ListItemIcon } from "@mui/material";
import { ReactComponent as CredentialFocus } from "../assets/sidemenu/Credential/Focus.svg";
import { ReactComponent as CredentialDefault } from "../assets/sidemenu/Credential/Default.svg";
import { ReactComponent as AlgorandFocus } from "../assets/sidemenu/Algorand/Focus.svg";
import { ReactComponent as AlgorandDefault } from "../assets/sidemenu/Algorand/Default.svg";
import { ReactComponent as DappsFocus } from "../assets/sidemenu/Dapps/Focus.svg";
import { ReactComponent as DappsDefault } from "../assets/sidemenu/Dapps/Default.svg";
import { ReactComponent as DIDsFocus } from "../assets/sidemenu/DIDs/Focus.svg";
import { ReactComponent as DIDsDefault } from "../assets/sidemenu/DIDs/Default.svg";
import { ReactComponent as ProfileFocus } from "../assets/sidemenu/Profile/Focus.svg";
import { ReactComponent as ProfileDefault } from "../assets/sidemenu/Profile/Default.svg";
import { ReactComponent as SettingsFocus } from "../assets/sidemenu/Settings/Focus.svg";
import { ReactComponent as SettingsDefault } from "../assets/sidemenu/Settings/Default.svg";

interface MenuIconInterface {
  name: string;
  isFocus: boolean;
}

export const MenuIcon: React.FC<MenuIconInterface> = ({
  name,
  isFocus = false,
}) => {
  const icon = () => {
    switch (name) {
      case "Credential":
        return isFocus ? <CredentialFocus /> : <CredentialDefault />;
      case "Algorand":
        return isFocus ? <AlgorandFocus /> : <AlgorandDefault />;
      case "Dapps":
        return isFocus ? <DappsFocus /> : <DappsDefault />;
      case "DIDs":
        return isFocus ? <DIDsFocus /> : <DIDsDefault />;
      case "Profile":
        return isFocus ? <ProfileFocus /> : <ProfileDefault />;
      case "Settings":
        return isFocus ? <SettingsFocus /> : <SettingsDefault />;
      default:
        return <SettingsDefault />;
    }
  };
  return <Box>{icon()}</Box>;
};
