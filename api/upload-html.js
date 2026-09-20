module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { filename, content, title, description, badge, password } = body;

    // Password check
    const correctPassword = process.env.UPLOAD_PASSWORD || "galeria123";
    if (password !== correctPassword) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    if (!filename || !content) {
      return res.status(400).json({ error: "Nome do arquivo e conteúdo são obrigatórios" });
    }

    // Clean filename
    let cleanName = filename
      .replace(/[^a-zA-Z0-9-_\.]/g, "-")
      .replace(/\.+/g, ".")
      .toLowerCase();
    if (!cleanName.endsWith(".html")) cleanName += ".html";

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "Token do GitHub não configurado no Vercel" });
    }

    const owner = "Willapela";
    const repo = "galery";
    const branch = "main";
    const filePath = `layouts/${cleanName}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "Vercel-Upload-Function"
    };

    // === 1. Upload the HTML file ===
    let fileSha = null;
    const getFile = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      { headers }
    );
    if (getFile.ok) {
      const data = await getFile.json();
      fileSha = data.sha;
    }

    const putFile = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Adiciona layout: ${cleanName}`,
          content: Buffer.from(content, "utf-8").toString("base64"),
          branch,
          ...(fileSha ? { sha: fileSha } : {})
        })
      }
    );

    const putFileData = await putFile.json();
    if (!putFile.ok) {
      return res.status(putFile.status).json({
        error: "Erro ao enviar arquivo para o GitHub",
        details: putFileData.message || putFileData
      });
    }

    // === 2. Update index.html to add the card ===
    const cardTitle = (title || cleanName.replace(".html", "")).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const cardDesc = (description || "Layout enviado pelo site").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const cardBadge = (badge || "HTML").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const newCard = `
      <!-- Card ${cardTitle} -->
      <a href="layouts/${cleanName}" class="card" target="_blank">
        <div class="card-preview">
          <div class="preview-placeholder">${cardTitle.substring(0, 14)}</div>
        </div>
        <div class="card-content">
          <h2>${cardTitle}</h2>
          <p>${cardDesc}</p>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <span class="badge">${cardBadge}</span>
            <a href="layouts/${cleanName}" download="${cleanName}" onclick="event.stopPropagation()" style="font-size:0.75rem; color:#b8a4ff; text-decoration:none;">⬇ Baixar</a>
          </div>
        </div>
      </a>
`;

    // Get current index.html
    const getIndex = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/index.html?ref=${branch}`,
      { headers }
    );

    if (!getIndex.ok) {
      return res.status(200).json({
        success: true,
        message: `Arquivo ${cleanName} enviado! (não foi possível atualizar o index automaticamente)`,
        path: filePath
      });
    }

    const indexData = await getIndex.json();
    let indexContent = Buffer.from(indexData.content, "base64").toString("utf-8");

    // Insert the new card before the "Adicionar novo" card
    const markers = [
      '<!-- Card - Adicionar novo -->',
      '<!-- Card 4 - Adicionar novo -->',
      'href="upload.html" class="card card-empty"'
    ];

    let updatedIndex = indexContent;
    let inserted = false;

    for (const marker of markers) {
      if (indexContent.includes(marker)) {
        if (marker.startsWith("href=")) {
          const idx = indexContent.indexOf(marker);
          const start = indexContent.lastIndexOf("<a ", idx);
          if (start !== -1) {
            updatedIndex = indexContent.slice(0, start) + newCard + "\n      " + indexContent.slice(start);
            inserted = true;
            break;
          }
        } else {
          updatedIndex = indexContent.replace(marker, newCard + "\n" + marker);
          inserted = true;
          break;
        }
      }
    }

    if (!inserted) {
      updatedIndex = indexContent.replace("</section>", newCard + "\n    </section>");
    }

    // Commit the updated index.html
    const putIndex = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/index.html`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Adiciona card: ${cardTitle}`,
          content: Buffer.from(updatedIndex, "utf-8").toString("base64"),
          branch,
          sha: indexData.sha
        })
      }
    );

    const putIndexData = await putIndex.json();

    if (!putIndex.ok) {
      return res.status(200).json({
        success: true,
        message: `Arquivo ${cleanName} enviado, mas houve erro ao criar o card automaticamente.`,
        path: filePath,
        details: putIndexData.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Layout "${cardTitle}" enviado e card criado com sucesso! O site atualiza em alguns segundos.`,
      path: filePath,
      url: putFileData.content && putFileData.content.html_url
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      error: "Erro interno",
      details: error.message
    });
  }
};
