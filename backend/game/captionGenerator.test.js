const { generateCaptions } = require('./captionGenerator');

describe('Caption Generator', () => {
  describe('generateCaptions', () => {
    test('should generate requested number of captions', () => {
      const count = 10;
      const captions = generateCaptions(count);
      
      expect(captions).toHaveLength(count);
    });

    test('should generate captions with unique IDs', () => {
      const captions = generateCaptions(5);
      const ids = captions.map(c => c.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('should generate captions with text property', () => {
      const captions = generateCaptions(3);
      
      captions.forEach(caption => {
        expect(caption).toHaveProperty('id');
        expect(caption).toHaveProperty('text');
        expect(typeof caption.text).toBe('string');
        expect(caption.text.length).toBeGreaterThan(0);
      });
    });

    test('should handle zero count', () => {
      const captions = generateCaptions(0);
      expect(captions).toHaveLength(0);
    });

    test('should generate different captions on multiple calls', () => {
      const captions1 = generateCaptions(5);
      const captions2 = generateCaptions(5);
      
      // Check that at least some IDs are different
      const ids1 = captions1.map(c => c.id);
      const ids2 = captions2.map(c => c.id);
      const allSame = ids1.every((id, index) => id === ids2[index]);
      
      expect(allSame).toBe(false);
    });

    test('should generate large number of captions', () => {
      const count = 100;
      const captions = generateCaptions(count);
      
      expect(captions).toHaveLength(count);
      captions.forEach(caption => {
        expect(caption.id).toBeDefined();
        expect(caption.text).toBeDefined();
      });
    });
  });
});
