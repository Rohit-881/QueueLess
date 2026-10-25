/**
 * Generates a human-readable token string from service prefix and sequence number.
 * Example: ("ADM", 14) -> "ADM-014"
 * Example: ("OPD", 102) -> "OPD-102"
 */
const formatTokenNumber = (prefix, sequence) => {
  const cleanPrefix = (prefix || 'TKN').toUpperCase().trim();
  const paddedSequence = String(sequence).padStart(3, '0');
  return `${cleanPrefix}-${paddedSequence}`;
};

module.exports = {
  formatTokenNumber,
};
