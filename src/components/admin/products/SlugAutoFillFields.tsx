'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SlugAutoFillFieldsProps = {
  nameLabel: string;
  slugLabel: string;
  slugHelp: string;
};

export type SlugAutoFillState = {
  name: string;
  slug: string;
  slugTouched: boolean;
};

type SlugAutoFillChange = {
  field: 'name' | 'slug';
  value: string;
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function transitionSlugAutoFill(
  state: SlugAutoFillState,
  change: SlugAutoFillChange,
): SlugAutoFillState {
  if (change.field === 'slug') {
    return { ...state, slug: change.value, slugTouched: true };
  }

  return {
    ...state,
    name: change.value,
    slug: state.slugTouched ? state.slug : slugify(change.value),
  };
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
    setSlug((currentSlug) => transitionSlugAutoFill(
      { name, slug: currentSlug, slugTouched },
      { field: 'name', value },
    ).slug);
  }

  function onSlugChange(value: string) {
    const nextState = transitionSlugAutoFill(
      { name, slug, slugTouched },
      { field: 'slug', value },
    );
    setSlugTouched(nextState.slugTouched);
    setSlug(nextState.slug);
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
