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
      className={`px-2.5 py-1.5 rounded text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? "bg-neutral-900 text-white" : "hover:bg-neutral-200 text-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-white px-3 py-2 sticky top-0 z-10">
      <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="underline">U</span>
      </ToolbarButton>

      <span className="w-px h-5 bg-neutral-300 mx-1" />

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

      <span className="w-px h-5 bg-neutral-300 mx-1" />

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
}: {
  initialContentHtml: string;
  editable: boolean;
  onChange: (html: string) => void;
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

  if (!editor) return null;

  return (
    <div className="border border-neutral-200 rounded-lg bg-white shadow-sm overflow-hidden">
      {editable && <Toolbar editor={editor} />}
      <div className="px-6 py-4 max-w-3xl mx-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
