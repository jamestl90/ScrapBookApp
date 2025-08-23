import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Heading } from '@tiptap/extension-heading'; 

// This is the menu bar that will have buttons for bold, italic, etc.
const MenuBar = ({ editor, onBgChange }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="editor-menu-bar">
      <select
        onChange={(e) => {
          const level = parseInt(e.target.value);
          if (level === 0) {
            // 0 will represent normal paragraph text
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: level }).run();
          }
        }}
        // This value reflects the currently selected heading level
        value={
          editor.isActive('heading', { level: 1 }) ? 1 :
          editor.isActive('heading', { level: 2 }) ? 2 :
          editor.isActive('heading', { level: 3 }) ? 3 : 0
        }
      >
        <option value="0">Normal</option>
        <option value="1">H1</option>
        <option value="2">H2</option>
        <option value="3">H3</option>
      </select>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
      >
        Italic
      </button>
      <label>Color</label>
      <input
        type="color"
        onInput={event => editor.chain().focus().setColor(event.target.value).run()}
        data-testid="setColor"
      />
      <label>Background</label>
      <input
        type="color"
        value={editor.getAttributes('textStyle').backgroundColor || '#FFFFFF'}
        onInput={event => onBgChange(event.target.value)}
        data-testid="setBgColor"
      />
      <button onClick={() => onBgChange('transparent')}>
        No BG
      </button>
    </div>
  );
};

// This is the main editor component
const RichTextEditor = ({ content, onUpdate, bgColor, onBgChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, }),
      TextStyle, // Add TextStyle
      Color.configure({ types: ['textStyle'] }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
    ],
    content: content, // The initial text to load
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: `background-color: ${bgColor};`,
      },
    },
  });

  return (
    <div className="text-editor-container">
      <MenuBar editor={editor} onBgChange={onBgChange} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;