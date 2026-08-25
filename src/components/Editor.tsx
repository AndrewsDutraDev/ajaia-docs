"use client";

import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect, useRef } from "react";

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? "bg-accent text-white" : "text-ink-soft hover:bg-accent-tint hover:text-accent-dark"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 bg-paper/70 backdrop-blur-sm px-3 py-2.5 sticky top-0 z-10 rounded-t-2xl">
      <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="underline">U</span>
      </ToolbarButton>

      <span className="w-px h-5 bg-line mx-1" />

      <ToolbarButton label="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
        Text
      </ToolbarButton>
      <ToolbarButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>

      <span className="w-px h-5 bg-line mx-1" />

      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>
    </div>
  );
}

export default function Editor({
  initialContentHtml,
  editable,
  onChange,
  onEditorReady,
  remoteContentHtml,
}: {
  initialContentHtml: string;
  editable: boolean;
  onChange: (html: string) => void;
  /** Called once the Tiptap instance exists, so a parent can poll `.isFocused` / push remote updates. */
  onEditorReady?: (editor: TiptapEditor) => void;
  /** When this changes and the editor isn't focused, its content replaces the editor's — used for live sync. */
  remoteContentHtml?: string;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialContentHtml,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChangeRef.current(editor.getHTML());
      }, 1200);
    },
  });

  useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (editor) onEditorReady?.(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    if (!editor || remoteContentHtml === undefined) return;
    if (editor.isFocused) return; // don't clobber active typing
    if (remoteContentHtml === editor.getHTML()) return;
    editor.commands.setContent(remoteContentHtml, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteContentHtml]);

  if (!editor) return null;

  return (
    <div className="rounded-2xl bg-white shadow-soft overflow-hidden">
      {editable && <Toolbar editor={editor} />}
      <div className="px-8 py-6 max-w-3xl mx-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
