exports.handler = async function(event, context) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { filename, content, password } = body;

    // Simple password protection
    const correctPassword = process.env.UPLOAD_PASSWORD || "galeria123";
    if (password !== correctPassword) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Senha incorreta" })
      };
    }

    if (!filename || !content) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Nome do arquivo e conteúdo são obrigatórios" })
      };
    }

    // Clean filename
    let cleanName = filename
      .replace(/[^a-zA-Z0-9-_\.]/g, "-")
      .replace(/\.+/g, ".")
      .toLowerCase();
    
    if (!cleanName.endsWith(".html")) {
      cleanName += ".html";
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Token do GitHub não configurado no Netlify" })
      };
    }

    const owner = "Willapela";
    const repo = "galery";
    const branch = "main";
    const path = `layouts/${cleanName}`;

    // Get current file SHA if exists (needed for update)
    let sha = null;
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "Netlify-Upload-Function"
        }
      }
    );

    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    // Create or update the file
    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "Netlify-Upload-Function"
        },
        body: JSON.stringify({
          message: `Adiciona layout: ${cleanName}`,
          content: Buffer.from(content, "utf-8").toString("base64"),
          branch: branch,
          ...(sha ? { sha } : {})
        })
      }
    );

    const putData = await putRes.json();

    if (!putRes.ok) {
      return {
        statusCode: putRes.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Erro ao enviar para o GitHub",
          details: putData.message || putData
        })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        message: `Arquivo ${cleanName} enviado com sucesso para o GitHub!`,
        path: path,
        url: putData.content?.html_url || `https://github.com/${owner}/${repo}/blob/${branch}/${path}`
      })
    };

  } catch (error) {
    console.error("Upload error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Erro interno",
        details: error.message
      })
    };
  }
};
