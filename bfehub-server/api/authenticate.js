// api/authenticate.js
// const axios = require('axios'); // Unused now

module.exports = async (req, res) => {
  // CORS Handling
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { code } = req.body || {};

  console.log('BFE_Hub Server: Received code', code ? 'Yes' : 'No');
  console.log('BFE_Hub Server: Client ID present?', !!process.env.CLIENT_ID);
  console.log('BFE_Hub Server: Client Secret present?', !!process.env.CLIENT_SECRET);

  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  try {
    const tokenUrl = 'https://github.com/login/oauth/access_token';
    const params = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code
    };
    
    // Use native fetch (Node 18+)
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        // This handles 404, 500, etc.
        const text = await response.text();
        console.error('GitHub API Error Status:', response.status);
        console.error('GitHub API Error Body:', text);
        return res.status(response.status).json({ error: `GitHub API Error: ${response.status}`, details: text });
    }

    const data = await response.json();
    console.log('GitHub API Success:', data.access_token ? 'Token received' : 'No token');

    const { access_token, error, error_description } = data;

    if (error) {
      return res.status(400).json({ error, error_description });
    }

    return res.status(200).json({ token: access_token });
  } catch (err) {
    console.error('Token Exchange Error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};
