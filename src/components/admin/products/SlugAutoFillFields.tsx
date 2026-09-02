'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SlugAutoFillFieldsProps = {
  nameLabel: string;
  slugLabel: string;
  slugHelp: string;
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function SlugAutoFillFields({
  nameLabel,
  slugLabel,
  slugHelp,
}: SlugAutoFillFieldsProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function onSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(value);
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">{nameLabel}</Label>
        <Input id="name" name="name" required value={name} onChange={(event) => onNameChange(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug" className="font-mono text-xs uppercase tracking-wide">
          {slugLabel}
        </Label>
        <Input
          id="slug"
          name="slug"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          value={slug}
          onChange={(event) => onSlugChange(event.target.value)}
        />
        <p className="text-xs text-admin-muted-foreground">{slugHelp}</p>
      </div>
    </>
  );
}
