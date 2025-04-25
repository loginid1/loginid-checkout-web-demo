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
import { Routes, Route } from 'react-router-dom';
import { CallbackPage } from './Callback';
import { CheckoutPage } from './Checkout';

function App() {
  return (
    <div className="App">

      <Routes>
        <Route path="/" element={<CheckoutPage/>} />
        <Route path="/callback" element={<CallbackPage/>} />
      </Routes>
    </div>
  );
}

export default App;
