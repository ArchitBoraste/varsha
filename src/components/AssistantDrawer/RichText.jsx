import { Fragment } from 'react';

// The assistant writes plain text with **bold** and "- " lists; this renders just that, as elements.

function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

const isItem = (line) => /^\s*[-•*]\s+/.test(line);

/** Paragraphs split on blank lines; consecutive "- " lines become a list. */
export default function RichText({ text, className }) {
  const blocks = [];
  for (const line of text.split('\n')) {
    const last = blocks.at(-1);
    if (!line.trim()) {
      if (last) last.closed = true;
    } else if (isItem(line)) {
      const item = line.replace(/^\s*[-•*]\s+/, '');
      if (last?.type === 'list' && !last.closed) last.lines.push(item);
      else blocks.push({ type: 'list', lines: [item] });
    } else if (last?.type === 'paragraph' && !last.closed) {
      last.lines.push(line);
    } else {
      blocks.push({ type: 'paragraph', lines: [line] });
    }
  }

  return (
    <div className={className}>
      {blocks.map((block, index) =>
        block.type === 'list' ? (
          <ul key={index}>
            {block.lines.map((line, i) => (
              <li key={i}>{inline(line)}</li>
            ))}
          </ul>
        ) : (
          <p key={index}>
            {block.lines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {inline(line)}
              </Fragment>
            ))}
          </p>
        ),
      )}
    </div>
  );
}
