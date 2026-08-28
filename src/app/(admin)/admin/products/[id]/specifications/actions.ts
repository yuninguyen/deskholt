'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  clearProductSpecificationDrafts,
  saveSpecificationDraft,
} from '@/lib/products/specificationDraftStore';
import { loadSpecificationData } from '@/lib/products/specificationRows';
import { createSaveSpecificationsAction } from '@/lib/products/specificationSaveAction';
import { validateProductAttributeInput } from '@/lib/products/productAttributeValidator';

const saveSpecifications = createSaveSpecificationsAction({
  loadSpecificationData: (productId) => loadSpecificationData(prisma, productId),
  validateProductAttributeInput: (input) => validateProductAttributeInput(prisma, input),
  transaction: (callback) => prisma.$transaction(callback),
  now: () => new Date(),
  saveDraft: saveSpecificationDraft,
  clearProductDrafts: clearProductSpecificationDrafts,
  redirect,
});

export async function saveSpecificationsAction(formData: FormData): Promise<void> {
  return saveSpecifications(formData);
}
