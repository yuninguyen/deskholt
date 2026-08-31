'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CONFIDENCES = ['VERIFIED', 'LIKELY', 'UNVERIFIED'] as const;
type Confidence = (typeof CONFIDENCES)[number];

const confidenceVariants = {
  VERIFIED: 'success',
  LIKELY: 'warning',
  UNVERIFIED: 'neutral',
} as const;

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
      <Badge variant={confidenceVariants[confidence]} className="mt-2 whitespace-nowrap">
        {labels[confidence]}
      </Badge>
    </>
  );
}
