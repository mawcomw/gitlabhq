require 'spec_helper'

describe Gitlab::Git::Storage::ForkedStorageCheck, skip_database_cleaner: true do
  let(:existing_path) do
    existing_path = TestEnv.repos_path
    FileUtils.mkdir_p(existing_path)
    existing_path
  end

  describe '.storage_accessible?' do
    it 'detects when a storage is not available' do
      expect(described_class.storage_available?('/non/existant/path')).to be_falsey
    end

    it 'detects when a storage is available' do
      expect(described_class.storage_available?(existing_path)).to be_truthy
    end

    it 'returns false when the check takes to long' do
      allow(described_class).to receive(:check_filesystem_in_fork) do
        fork { sleep 10 }
      end

      expect(described_class.storage_available?(existing_path, 0.5)).to be_falsey
    end

    describe 'when using paths with spaces' do
      let(:test_dir) { Rails.root.join('tmp', 'tests', 'storage_check') }
      let(:path_with_spaces) { File.join(test_dir, 'path with spaces') }

      around do |example|
        FileUtils.mkdir_p(path_with_spaces)
        example.run
        FileUtils.rm_r(test_dir)
      end

      it 'works for paths with spaces' do
        expect(described_class.storage_available?(path_with_spaces)).to be_truthy
      end

      it 'works for a realpath with spaces' do
        symlink_location = File.join(test_dir, 'a symlink')
        FileUtils.ln_s(path_with_spaces, symlink_location)

        expect(described_class.storage_available?(symlink_location)).to be_truthy
      end
    end
  end
end
