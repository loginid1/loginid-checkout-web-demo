/*
 *   Copyright (c) 2024 LoginID Inc
 *   All rights reserved.

 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */


import './App.css';
import { Route, Routes } from 'react-router-dom';
import '@mantine/core/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';
import IDVPage from './pages/discover';
import { CheckoutPage } from './pages/checkout';
import BankingPage from './pages/banking';
import { CheckoutExternalPage } from './pages/checkout/external';
import DiscoverPage from './pages/discover';

const theme = createTheme({
  /** Put your mantine theme override here */
});

function App() {
  return (
    <div className="App">
    <MantineProvider theme={theme}>
      <Routes>
        <Route path="/" element={<CheckoutPage/>} />
        <Route path="/idv" element={<IDVPage/>} />
        <Route path="/discover" element={<DiscoverPage/>} />
        <Route path="/checkout" element={<CheckoutPage/>} />
        <Route path="/banking" element={<BankingPage/>} />
        <Route path="/external" element={<CheckoutExternalPage/>} />
      </Routes>
    </MantineProvider>
    </div>
  );
}

export default App;
