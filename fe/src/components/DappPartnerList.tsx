import * as React from 'react';
import styles from "../styles/common.module.css";
import { Grid, CardMedia, Typography, Box, Stack } from '@mui/material';


export default function DappPartnerList() {
  return (
    <Grid container spacing={1}>
      {itemData.map((item) => (
        <Grid container item xs={6} sm={6} md={4} key={item.key} className={styles.parnterRoot}>
          <Box className={styles.partnerBox} sx={{m:1}}>

          <CardMedia
            component={"img"}
            className={styles.partnerMedia}
            src={images.get(`${item.img}`)}
            sx={{p:2,width:"100%",height:"75%",objectFit:"contain"}}
          />
          <Stack className={styles.partnerText} sx={{ml:1,mr:1}}>

          <Typography variant="title" align="left">{item.title}</Typography>
          <Typography variant="caption" align="left">{item.desc}</Typography>
          </Stack>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

  export const importAll = (r: __WebpackModuleApi.RequireContext) =>{

  let filemap = new Map<string,any>();
  r.keys().forEach((fileName: string) =>{

		const key = fileName.substr(2).replace(/\/index\.mdx$/, '');
		filemap.set(key,r(fileName));
  } );
  return filemap;
  }
const images = importAll(require.context('./../assets/partners/', false, /\.svg$/));
const itemData = [
  {
    key: 'algorand',
    img: 'AlgorandLogo.svg',
    title: 'Algorand Foundation',
    desc: 'Powerful and sustainable blockchain',
  },
  {
    key: 'folk',
    img: 'folk_finance.svg',
    title: 'Folks Finance',
    desc: 'DeFi Lending Platform',
  },
];
