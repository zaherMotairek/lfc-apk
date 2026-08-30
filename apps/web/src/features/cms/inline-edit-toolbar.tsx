import { useCmsInlineEdit } from './use-cms-inline-edit';

export function InlineEditToolbar() {
  const { canEdit, isDirty, isSaving, save, reset } = useCmsInlineEdit();

  if (!canEdit) {
    return null;
  }

  return (
    <div className="inline-edit-toolbar">
      <div className="inline-edit-toolbar-inner">
        <span className="inline-edit-toolbar-label">
          ✏️ Edit mode — click any highlighted text to edit
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="kop-btn-secondary !py-2 !text-xs"
            onClick={() => reset()}
            disabled={!isDirty || isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="kop-btn-primary !py-2 !text-xs"
            onClick={() => void save()}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
