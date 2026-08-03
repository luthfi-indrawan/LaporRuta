const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

class SupabaseStorage {
  constructor() {
    if (!SupabaseStorage.instance) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );
      this.bucket = process.env.SUPABASE_STORAGE_BUCKET || "default-bucket";
      SupabaseStorage.instance = this;
    }
    return SupabaseStorage.instance;
  }

  async upload(filePath, fileBuffer, contentType = "application/octet-stream") {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) throw error;
    return data;
  }

  async getPublicUrl(filePath) {
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(filePath);
    return data.publicUrl;
  }

  async delete(filePath) {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([filePath]);
    if (error) throw error;
    return true;
  }

  async download(filePath) {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .download(filePath);
    if (error) throw error;
    return data;
  }
}

const supabaseStorage = new SupabaseStorage();
module.exports = supabaseStorage;
