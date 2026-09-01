export const en = {
  header: {
    title: 'Deskholt Admin',
    localeLabel: 'Language',
    themeLabel: 'Toggle light/dark theme',
    lightAction: 'Light',
    darkAction: 'Dark',
  },
  login: {
    title: 'Deskholt Admin',
    prompt: 'Enter the admin password to continue.',
    invalidPassword: 'Incorrect password. Please try again.',
    password: 'Password',
    submit: 'Sign in',
  },
  products: {
    title: 'Standing Desks — Admin',
    description: 'Manage product publication and search-index visibility.',
    newProduct: 'New Product',
    saved: 'Saved successfully. The affected Product is highlighted below.',
    publishingRejected: 'Publishing action rejected.',
    table: { product: 'Product', lifecycle: 'Lifecycle', index: 'Index', attributes: 'Attrs', actions: 'Actions' },
    lifecycle: { DRAFT: 'Draft', ACTIVE: 'Active', BLOCKED: 'Blocked', ARCHIVED: 'Archived' },
    access: {
      eligible: 'Eligible for public listings and indexing',
      explicitNoindex: 'Public, excluded from indexing',
      draft: 'Draft—not public',
      blocked: 'Blocked—not public',
      archived: 'Archived—not public',
    },
    index: { enabled: 'Enabled', disabled: 'Disabled', enable: 'Enable index', disable: 'Disable index', enableHelp: 'Set lifecycle to Active to enable indexing.' },
    actions: { save: 'Save', editSpecifications: 'Edit specifications', offers: 'Offers' },
    empty: 'No Standing Desk products yet.',
    errors: {
      invalidInput: 'Invalid publishing request. Review the Product and command values, then try again.',
      missing: 'Product could not be found. Refresh the list before trying another publishing command.',
      activeOnly: 'Set the lifecycle to Active before enabling indexing.',
      concurrencyConflict: 'This Product changed while the command was running. Review its current state and retry.',
      fallback: 'Publishing action could not be completed. Review the Product state and try again.',
    },
  },
  createProduct: {
    back: 'Products', title: 'Create Product', description: 'Create the Product identity, then continue to specifications.',
    rejected: 'Product creation rejected.', name: 'Name', slug: 'Slug', slugHelp: 'Lowercase letters, digits, and hyphens only.',
    category: 'Category', selectCategory: 'Select a Category', brandName: 'Brand name', optional: 'optional', descriptionLabel: 'Description',
    imageUrl: 'Image URL', upcSku: 'UPC/SKU', sustainable: 'Sustainable product', submit: 'Create Product',
    errors: {
      invalidInput: 'Review the required Product fields and try again.',
      categoryMissing: 'The selected Category no longer exists. Refresh and choose another Category.',
      slugTaken: 'That Product slug is already in use. Choose a different slug.',
      fallback: 'Product could not be created. Review the form and try again.',
    },
  },
  specifications: {
    categoryUnavailable: 'This product category is not defined in the Attribute Engine — there are no attributes to enter.',
    back: 'Products', completeness: 'Completeness', saved: 'Specifications saved successfully.',
    errors: { rowsInvalid: 'rows have errors and could not be saved — correct them and save again.', staleEnum: 'The saved ENUM value is no longer in the allowed list. Choose a new value before saving.' },
    derived: 'Derived', true: 'True', false: 'False', emptyOption: '—', staleEnumSuffix: 'stored value — no longer allowed',
    sourceUrl: 'Source URL', sourceType: 'Source type', productLevel: 'Product-level', noProductAttributes: 'No product-level attributes.',
    noVariants: 'This product has no Variants. Create a Variant before entering Variant-level specifications.',
    noActiveVariants: 'This product has no active Variants. Create or activate a Variant before entering Variant-level specifications.',
    variant: 'Variant', submit: 'Save Specifications',
    sourceTypes: { MANUFACTURER: 'Manufacturer', MANUAL: 'Manual', RETAILER: 'Retailer', CERTIFICATION: 'Certification', OTHER: 'Other' },
    confidences: { VERIFIED: 'Verified', LIKELY: 'Likely', UNVERIFIED: 'Unverified' },
  },
  offers: {
    back: 'Products', title: 'Offers', addOffer: 'Add offer', save: 'Save',
    network: 'Network', price: 'Price', rawUrl: 'Product URL', inStock: 'In stock',
    priorityOrder: 'Priority', inStockBadge: 'In stock', outOfStockBadge: 'Out of stock',
    saved: 'Offer saved successfully.', selectNetwork: 'Select a network',
    networks: { amazon: 'Amazon', walmart: 'Walmart', target: 'Target', awin: 'Awin', impact: 'Impact', cj: 'CJ' },
    empty: 'No offers yet for this product.',
    errors: {
      invalidInput: 'Review the offer fields (network, price, URL) and try again.',
      notFound: 'That offer could not be found for this product. Refresh and try again.',
      fallback: 'Offer could not be saved. Review the form and try again.',
    },
  },
} as const;

type DictionaryValue<T> = T extends string
  ? string
  : { readonly [Key in keyof T]: DictionaryValue<T[Key]> };

export type Dictionary = DictionaryValue<typeof en>;
