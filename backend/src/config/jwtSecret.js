function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (s != null && String(s).trim() !== '') {
    return String(s).trim();
  }
  return 'ccs_profiling_dev_secret_change_in_production';
}

module.exports = { getJwtSecret };
