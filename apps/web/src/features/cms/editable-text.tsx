import { useEffect, useRef, useState } from 'react';
import { useCmsInlineEdit } from './use-cms-inline-edit';

type EditableTextProps = {
  value: string;
  onSave: (value: string) => void;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div';
  className?: string;
  multiline?: boolean;
  placeholder?: string;
};

export function EditableText({
  value,
  onSave,
  as: Tag = 'span',
  className = '',
  multiline = false,
  placeholder = 'Click to edit…',
}: EditableTextProps) {
  const { canEdit } = useCmsInlineEdit();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setDraft(value);
    }
    setEditing(false);
  }

  if (!canEdit) {
    return <Tag className={className}>{value}</Tag>;
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setDraft(value);
              setEditing(false);
            }
          }}
          className={`editable-input editable-input-multiline ${className}`}
          rows={Math.min(12, Math.max(4, draft.split('\n').length + 1))}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            commit();
          }
          if (event.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={`editable-input ${className}`}
      />
    );
  }

  return (
    <Tag
      role="button"
      tabIndex={0}
      className={`editable-text ${className}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setEditing(true);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setEditing(true);
        }
      }}
      title="Admin: click to edit"
    >
      {value || placeholder}
    </Tag>
  );
}
