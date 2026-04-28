// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThirdwebProvider } from '@thirdweb-dev/react';
import App from './App';
import './styles/index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThirdwebProvider
      activeChain={{
        chainId: 80002, // ✅ Polygon Amoy
        rpc: [
          "https://rpc-amoy.polygon.technology/",
          "https://polygon-amoy-bor-rpc.publicnode.com",
          "https://rpc.ankr.com/polygon_amoy"
        ],
        nativeCurrency: {
          name: "POL",
          symbol: "POL",
          decimals: 18,
        },
        shortName: "amoy",
        slug: "polygon-amoy", 
        name: "Polygon Amoy Testnet",
      }}
      clientId="afbc3b243be3c208b920dc0e2ec3d7e2"
    >
      <App />
    </ThirdwebProvider>
  </React.StrictMode>
);