"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  MAX_LEAD_FIELDS,
  slugifyLabel,
  uniqueKey,
  type LeadField,
  type LeadFieldType,
} from "@/lib/lead-fields";


export function LeadFieldEditor({
  fields,
  onChange,
  error,
}: {
  fields: LeadField[];
  onChange: (fields: LeadField[]) => void;
  error?: string;
}) {
  const savedKeys = useRef(new Set(fields.map((field) => field.key)));

  function update(index: number, patch: Partial<LeadField>) {
    onChange(
      fields.map((field, position) => {
        if (position !== index) return field;

        const next = { ...field, ...patch };
        if (patch.label !== undefined && !savedKeys.current.has(field.key)) {
          next.key = uniqueKey(
            slugifyLabel(patch.label),
            fields
              .filter((_, other) => other !== index)
              .map((other) => other.key),
          );
        }
        return next;
      }),
    );
  }

  function remove(index: number) {
    onChange(fields.filter((_, position) => position !== index));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;

    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function add() {
    if (fields.length >= MAX_LEAD_FIELDS) return;

    const label = `Trường ${fields.length + 1}`;
    onChange([
      ...fields,
      {
        key: uniqueKey(
          slugifyLabel(label),
          fields.map((field) => field.key),
        ),
        label,
        type: "text",
        required: false,
      },
    ]);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="hidden"
        name="leadFormFields"
        value={JSON.stringify(fields)}
        readOnly
      />

      <div className="flex flex-col gap-1">
        <Label>Trường phụ</Label>
        <p className="text-xs text-muted-foreground">
          Thêm ô ngoài họ tên và số điện thoại. Xoá một trường không xoá dữ liệu
          khách đã điền trước đó — vẫn tải được trong file CSV.
        </p>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          Chưa có trường phụ nào.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <li
              key={index}
              className="flex flex-wrap items-end gap-2 rounded-md border border-border p-3"
            >
              <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
                <Label htmlFor={`lead-field-label-${index}`} className="text-xs">
                  Nhãn
                </Label>
                <Input
                  id={`lead-field-label-${index}`}
                  value={field.label}
                  onChange={(event) => update(index, { label: event.target.value })}
                  placeholder="Ví dụ: Email"
                />
              </div>

              <div className="flex w-32 flex-col gap-1">
                <Label htmlFor={`lead-field-type-${index}`} className="text-xs">
                  Kiểu
                </Label>
                <Select
                  id={`lead-field-type-${index}`}
                  value={field.type}
                  onChange={(event) =>
                    update(index, { type: event.target.value as LeadFieldType })
                  }
                >
                  <option value="text">Văn bản</option>
                  <option value="email">Email</option>
                </Select>
              </div>

              <label className="flex h-9 items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(event) =>
                    update(index, { required: event.target.checked })
                  }
                  className="size-4 cursor-pointer accent-primary"
                />
                Bắt buộc
              </label>

              <div className="flex h-9 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Đưa ${field.label} lên trên`}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => move(index, 1)}
                  disabled={index === fields.length - 1}
                  aria-label={`Đưa ${field.label} xuống dưới`}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => remove(index)}
                  aria-label={`Xoá trường ${field.label}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={fields.length >= MAX_LEAD_FIELDS}
        >
          <Plus />
          Thêm trường
        </Button>
        {fields.length >= MAX_LEAD_FIELDS ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Đã đạt tối đa {MAX_LEAD_FIELDS} trường phụ.
          </p>
        ) : null}
      </div>
    </div>
  );
}
