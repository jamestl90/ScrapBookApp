import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// This is the menu bar that will have buttons for bold, italic, etc.
const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="editor-menu-bar">
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
    </div>
  );
};

// This is the main editor component
const RichTextEditor = ({ content, onUpdate }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: content, // The initial text to load
    onUpdate: ({ editor }) => {
      // When the content changes, call the onUpdate function from the parent
      onUpdate(editor.getHTML());
    },
  });

  return (
    <div className="text-editor-container">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;