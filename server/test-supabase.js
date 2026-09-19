require("dotenv").config();

const supabase = require("./src/config/supabase");

async function main() {
  const { data, error } = await supabase
    .from("products")
    .select("*");

  if (error) {
    console.error("Supabase connection failed:");
    console.error(error);
    process.exit(1);
  }

  console.log("Supabase connection successful!");
  console.log("Products:", data);
}

main().catch(error => {
  console.error("Unexpected error:", error);
});