'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SOURCE_TYPES = ['MANUFACTURER', 'MANUAL', 'RETAILER', 'CERTIFICATION', 'OTHER'] as const;
const CLEAR_SOURCE_TYPE_VALUE = '__clear-source-type__';
type SourceType = (typeof SOURCE_TYPES)[number];

type SpecificationSourceTypeSelectProps = {
  name: string;
  defaultValue: string;
  placeholder: string;
  labels: Record<SourceType, string>;
};

export default function SpecificationSourceTypeSelect({
  name,
  defaultValue,
  placeholder,
  labels,
}: SpecificationSourceTypeSelectProps) {
  const [selectedValue, setSelectedValue] = useState(defaultValue);

  return (
    <>
      <Select value={selectedValue} onValueChange={(value) => setSelectedValue(value === CLEAR_SOURCE_TYPE_VALUE ? '' : value)}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={CLEAR_SOURCE_TYPE_VALUE}>{placeholder}</SelectItem>
          {SOURCE_TYPES.map((sourceType) => (
            <SelectItem key={sourceType} value={sourceType}>
              {labels[sourceType]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name={name} value={selectedValue} />
    </>
  );
}
