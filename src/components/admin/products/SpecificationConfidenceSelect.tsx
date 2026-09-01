'use client';

import { useState } from 'react';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CONFIDENCES = ['VERIFIED', 'LIKELY', 'UNVERIFIED'] as const;
type Confidence = (typeof CONFIDENCES)[number];

const confidenceVariants = {
  VERIFIED: 'success',
  LIKELY: 'warning',
  UNVERIFIED: 'neutral',
} as const;

export function confidencePresentation(
  confidence: Confidence,
  labels: Record<Confidence, string>,
) {
  return { label: labels[confidence], variant: confidenceVariants[confidence] };
}

type SpecificationConfidenceSelectProps = {
  name: string;
  defaultValue: Confidence;
  labels: Record<Confidence, string>;
};

export default function SpecificationConfidenceSelect({
  name,
  defaultValue,
  labels,
}: SpecificationConfidenceSelectProps) {
  const [confidence, setConfidence] = useState<Confidence>(defaultValue);
  const presentation = confidencePresentation(confidence, labels);

  return (
    <>
      <Select name={name} defaultValue={defaultValue} onValueChange={(value) => setConfidence(value as Confidence)}>
        <SelectTrigger>
          <SelectValue placeholder={labels.UNVERIFIED} />
        </SelectTrigger>
        <SelectContent>
          {CONFIDENCES.map((confidenceValue) => (
            <SelectItem key={confidenceValue} value={confidenceValue}>
              {labels[confidenceValue]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <AdminStatusBadge variant={presentation.variant} className="mt-2">
        {presentation.label}
      </AdminStatusBadge>
    </>
  );
}
