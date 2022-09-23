import { Paper, Typography } from "@mui/material";
import React, { ReactNode, useEffect, useState } from "react";
import { VaultBase } from "../../components/VaultBase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import HelpMDX from "!!@mdx-js/loader!./help.mdx";
import {MDXProvider} from '@mdx-js/react'
import { H2, H3 } from "../../components/mdx/Heading";

const components = {
  //h2: ({ children }: { children?: ReactNode }) => <h2 className='text-red'>{children}</h2> ,
  //h4: ({children}:{children?:ReactNode}) => <h4 className='text-red'>{children}</h4> 
  h2: ({ children }: { children?: ReactNode }) => H2({children}) ,
  h3: ({ children }: { children?: ReactNode }) => H3({children}) ,
};

export function Help() {

	return (
		<VaultBase focus={4}>
			<Paper
				elevation={0}
				sx={{
					p: { md: 4, xs: 2 },
					textAlign: "left",
				}}
			>
        <HelpMDX components={components}/>
			</Paper>
		</VaultBase>
	);
}




