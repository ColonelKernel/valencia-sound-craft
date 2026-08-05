/**
 * JSON-LD serialization for the head-stamping plugin.
 *
 * NEVER pass this output through an HTML attribute escaper: escaping `"` or
 * `&` corrupts the JSON. The only character that must not appear raw inside a
 * <script> data block is `<` (it could open `</script>` or `<!--`), and
 * `<` is valid JSON that browsers parse back to `<`.
 */
export function serializeJsonLd(data: object, url: string): string {
  return JSON.stringify({ ...data, url }).replace(/</g, "\\u003c");
}
