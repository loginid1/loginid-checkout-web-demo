import { useRef, useState, useEffect } from "react";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {SvgIcon, SvgIconTypeMap} from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";

/*
export const importAll = (r: __WebpackModuleApi.RequireContext) =>
	r.keys().map((fileName: string) => ({
		slug: fileName.substr(2).replace(/\/index\.mdx$/, ''),
		module: r(fileName),
	}))
*/
  export const importAll = (r: __WebpackModuleApi.RequireContext) =>{

  let filemap = new Map<string,any>();
  r.keys().forEach((fileName: string) =>{

		const key = fileName.substr(2).replace(/\/index\.mdx$/, '');
		filemap.set(key,r(fileName));
  } );
  return filemap;
  }
const images = importAll(require.context('./../assets/asa/', false, /\.svg$/));


interface UseDynamicSVGImportOptions {
    onCompleted?: (
      name: string,
      SvgIcon: React.FC<React.SVGProps<SVGSVGElement>> | undefined
    ) => void;
    onError?: (err: Error) => void;
  }
  
  function useDynamicSVGImport(
    name: string,
    options: UseDynamicSVGImportOptions = {}
  ) {
    const ImportedIconRef = useRef<React.FC<React.SVGProps<SVGSVGElement>>>();
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
      setLoading(true);
      const importIcon = async (): Promise<void> => {
        try {
          //const filename = `./${name}.svg`;
          //console.log("SVG "+ filename );
          const number = "136";
          const ext = ".svg";
          const filename = "LTEST2-136.svg" ;
          ImportedIconRef.current = (
            //await import("./LTEST2-136.svg")
            await import(`./../assets/test/${name}.svg`)
          ).ReactComponent;
        } catch (err) {
          console.log("SVG error: "+err);
        } finally {
          console.log("svg final: "  + name + " "+ ImportedIconRef.current );
          setLoading(false);
        }
      };
      importIcon();
    }, []);
  
    return {  Svg: ImportedIconRef.current };
  }
/* 
  interface IconProps extends OverridableComponent<SvgIconTypeMap<{}, "svg">> {
    name: string;
  }*/
  interface IconProps  {
    name: string;
  }
  
  /**
   * Simple wrapper for dynamic SVG import hook. You can implement your own wrapper,
   * or even use the hook directly in your components.
   */
  export function ASAIcon(props: IconProps ){
   // const {  Svg } = useDynamicSVGImport(props.name);
    //console.log(images);
    const filename = props.name + ".svg";
    const file = images.get(filename);
    if (file) {
      return <img src={file} width="20" height="20"/>;
    } else {
	    return <SvgIcon component={HelpOutlineIcon} {...props} />;
    }
    /* 
    if (Svg) {
      console.log("return svg ");
	  return <SvgIcon component={Svg} {...props} />;
    } else {
	  return <SvgIcon component={HelpOutlineIcon} {...props} />;
    }*/
  };
 