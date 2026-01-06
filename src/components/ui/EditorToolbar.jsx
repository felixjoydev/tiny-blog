/**
 * EditorToolbar - Floating formatting toolbar for Tiptap editor
 * @param {Object} props
 * @param {Object} props.editor - Tiptap editor instance
 */
export default function EditorToolbar({ editor }) {
  if (!editor) {
    return null;
  }

  const buttonClass = "px-3 py-1.5 rounded hover:bg-[rgba(63,51,28,0.1)] transition-colors type-body text-[#3f331c]";
  const activeClass = "bg-[rgba(63,51,28,0.15)] font-semibold";

  return (
    <div className="sticky top-[calc(var(--nav-height)+1rem)] z-10 mb-6 p-2 bg-[#FFFAEF] border border-[rgba(63,51,28,0.2)] rounded-lg shadow-sm flex flex-wrap gap-1">
      {/* Text formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`${buttonClass} ${editor.isActive('bold') ? activeClass : ''}`}
        title="Bold (Cmd+B)"
      >
        <strong>B</strong>
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`${buttonClass} ${editor.isActive('italic') ? activeClass : ''}`}
        title="Italic (Cmd+I)"
      >
        <em>I</em>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={`${buttonClass} ${editor.isActive('code') ? activeClass : ''}`}
        title="Code"
      >
        {'</>'}
      </button>

      <div className="w-px h-6 bg-[rgba(63,51,28,0.2)] self-center mx-1" />

      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${buttonClass} ${editor.isActive('heading', { level: 1 }) ? activeClass : ''}`}
        title="Heading 1"
      >
        H1
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${buttonClass} ${editor.isActive('heading', { level: 2 }) ? activeClass : ''}`}
        title="Heading 2"
      >
        H2
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${buttonClass} ${editor.isActive('heading', { level: 3 }) ? activeClass : ''}`}
        title="Heading 3"
      >
        H3
      </button>

      <button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`${buttonClass} ${editor.isActive('paragraph') ? activeClass : ''}`}
        title="Paragraph"
      >
        P
      </button>

      <div className="w-px h-6 bg-[rgba(63,51,28,0.2)] self-center mx-1" />

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${buttonClass} ${editor.isActive('bulletList') ? activeClass : ''}`}
        title="Bullet List"
      >
        • List
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${buttonClass} ${editor.isActive('orderedList') ? activeClass : ''}`}
        title="Numbered List"
      >
        1. List
      </button>

      <div className="w-px h-6 bg-[rgba(63,51,28,0.2)] self-center mx-1" />

      {/* Quote & Code Block */}
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${buttonClass} ${editor.isActive('blockquote') ? activeClass : ''}`}
        title="Blockquote"
      >
        " Quote
      </button>

      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`${buttonClass} ${editor.isActive('codeBlock') ? activeClass : ''}`}
        title="Code Block"
      >
        {'<Code/>'}
      </button>

      <div className="w-px h-6 bg-[rgba(63,51,28,0.2)] self-center mx-1" />

      {/* Horizontal Rule */}
      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={buttonClass}
        title="Horizontal Rule"
      >
        ―
      </button>
    </div>
  );
}
