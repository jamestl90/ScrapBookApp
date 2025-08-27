import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import './RichTextEditor.css'; 
import { 
  FaBold, FaItalic, FaAlignLeft, FaAlignCenter, FaAlignRight 
} from 'react-icons/fa';

function toHex(color) {
  if (!color) return '#ffffff';
  if (color.startsWith('#')) return color;

  const rgb = color.match(/\d+/g).map(Number);
  return (
    '#' +
    rgb
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

// --- The Toolbar Component ---
const Toolbar = ({ editor, onBgChange, bgColor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="editor-toolbar">
      
      {/* Headings */}
      <select
        className="toolbar-select"
        value={
          editor.isActive('heading', { level: 1 }) ? 'h1' :
          editor.isActive('heading', { level: 2 }) ? 'h2' :
          'p'
        }
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'p') {
            editor.chain().focus().setParagraph().run();
          }
          if (value === 'h1') {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          }
          if (value === 'h2') {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          }
        }}
      >
        <option value="p">Normal</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
      </select>

      {/* Bold, Italic */}
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Bold">
        <FaBold />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Italic">
        <FaItalic />
      </button>

      {/* Text Alignment - now with icons */}
      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''} title="Align Left">
        <FaAlignLeft />
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''} title="Align Center">
        <FaAlignCenter />
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''} title="Align Right">
        <FaAlignRight />
      </button>

      {/* Foreground Color */}
      <input
        type="color"
        onInput={(event) => editor.chain().focus().setColor(event.target.value).run()}
        value={toHex(editor.getAttributes('textStyle').color) || '#ffffff'}
        title="Text Color"
      />
      
      {/* Background Color (for the entire element) */}
      <input
        type="color"
        onInput={(event) => onBgChange(event.target.value)}
        value={bgColor || '#000000'}
        title="Background Color"
      />
    </div>
  );
};

// --- The Main Editor Component ---
const RichTextEditor = ({ content, onUpdate, onBgChange, bgColor }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  return (
    <div className="text-editor-container" style={{ backgroundColor: bgColor === 'transparent' ? '#2d2d2d' : bgColor }}>
      <Toolbar editor={editor} onBgChange={onBgChange} bgColor={bgColor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;