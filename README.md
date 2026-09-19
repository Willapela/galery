# Meus Layouts HTML

Site simples e moderno para hospedar e mostrar seus layouts HTML.

## Estrutura de pastas

```
html-gallery/
├── index.html          ← Página principal (galeria)
├── styles.css          ← Estilos da galeria
├── layouts/            ← Coloque seus HTMLs aqui
│   ├── exemplo-1.html
│   ├── exemplo-2.html
│   ├── exemplo-3.html
│   └── seu-layout.html   ← adicione os seus
└── README.md
```

## Como adicionar seus layouts

1. Coloque o arquivo HTML dentro da pasta `layouts/`
2. Abra o `index.html`
3. Copie um dos cards existentes e altere:
   - O `href` para o nome do seu arquivo
   - O título e a descrição
   - O texto do badge (opcional)

Exemplo de card:

```html
<a href="layouts/meu-layout.html" class="card" target="_blank">
  <div class="card-preview">
    <div class="preview-placeholder">Meu Layout</div>
  </div>
  <div class="card-content">
    <h2>Nome do Layout</h2>
    <p>Descrição curta do que é esse layout.</p>
    <span class="badge">HTML + CSS</span>
  </div>
</a>
```

## Como hospedar de graça

### Opção 1 – Netlify (mais fácil)
1. Acesse [netlify.com](https://www.netlify.com)
2. Arraste a pasta `html-gallery` inteira na área de deploy
3. Pronto! Você ganha um link público

### Opção 2 – Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Faça upload da pasta ou conecte com GitHub

### Opção 3 – GitHub Pages
1. Crie um repositório no GitHub
2. Envie os arquivos
3. Ative o GitHub Pages nas configurações do repositório

## Personalização rápida

- Troque o título no `<h1>` do `index.html`
- Mude as cores no arquivo `styles.css` (variáveis no `:root`)
- Adicione quantos cards quiser

Feito para ser simples e fácil de usar.
