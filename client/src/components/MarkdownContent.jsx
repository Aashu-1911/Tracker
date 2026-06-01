const renderInline = (text) => {
  const parts = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={`${match.index}-b`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      parts.push(<em key={`${match.index}-i`}>{token.slice(1, -1)}</em>);
    } else {
      parts.push(<code key={`${match.index}-c`}>{token.slice(1, -1)}</code>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

const MarkdownContent = ({ content, className = "" }) => {
  const blocks = String(content || "").split("\n");

  return (
    <div className={className}>
      {blocks.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={`spacer-${index}`} className="markdown-spacer" />;
        }
        if (trimmed.startsWith("- ")) {
          return (
            <div key={`li-${index}`} className="markdown-list-item">
              <span className="markdown-bullet">•</span>
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }
        if (trimmed.startsWith("### ")) {
          return <h5 key={`h3-${index}`}>{trimmed.slice(4)}</h5>;
        }
        if (trimmed.startsWith("## ")) {
          return <h4 key={`h2-${index}`}>{trimmed.slice(3)}</h4>;
        }
        if (trimmed.startsWith("# ")) {
          return <h3 key={`h1-${index}`}>{trimmed.slice(2)}</h3>;
        }

        return <p key={`p-${index}`}>{renderInline(line)}</p>;
      })}
    </div>
  );
};

export default MarkdownContent;
