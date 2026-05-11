# import google.generativeai as genai

# def get_resident_evil_order_with_search():
#     # 1. Paste your API key here
#     api_key = "AIzaSyDHJYCyT6F3pk-LMLCeuME_aenmjS48G-A"
    
#     if api_key == "YOUR_NEW_API_KEY_HERE":
#         print("Please replace 'YOUR_NEW_API_KEY_HERE' with your actual Gemini API key.")
#         return

#     # 2. Configure the SDK
#     genai.configure(api_key=api_key)

#     # 3. Initialize the model with the correct Search Tool syntax
#     model = genai.GenerativeModel(
#         model_name='gemini-2.5-flash',
#         tools=[{'google_search': {}}]
#     )

#     # 4. Define the prompt
#     prompt = (
#         "What is the recommended chronological playing order for the the last o series just give names? "
#     )

#     print("Sending prompt to Gemini API with Google Search enabled...\n")

#     # 5. Generate the response
#     try:
#         response = model.generate_content(prompt)
        
#         # 6. Print the result
#         print("=== Resident Evil Playing Order (Live Search Enabled) ===")
#         print(response.text)
        
#         # Optional: Check if the model actually used search sources
#         if response.candidates[0].grounding_metadata.search_entry_point:
#             print("\n(Note: This response was grounded using Google Search results.)")
            
#     except Exception as e:
#         print(f"An error occurred: {e}")

# if __name__ == "__main__":
#     get_resident_evil_order_with_search()

# import requests

# def fetch_steam_tags(language="english"):
#     url = f"https://store.steampowered.com/api/gettaglist/?language={language}"
    
#     headers = {
#         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
#         "Accept-Language": "en-US,en;q=0.9",
#         "Accept": "application/json",
#     }
    
#     response = requests.get(url, headers=headers)
#     response.raise_for_status()
    
#     data = response.json()
#     return data["response"]["tags"]

# # Usage
# tags = fetch_steam_tags()
# for tag in tags[:10]:
#     print(f"ID: {tag['tagid']}, Name: {tag['name']}")

import requests

def fetch_steam_tags():
    url = "https://store.steampowered.com/tagdata/populartags/english"
    
    session = requests.Session()
    # Grab cookies first
    session.get("https://store.steampowered.com/", headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    })
    
    response = session.get(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://store.steampowered.com/",
        "X-Requested-With": "XMLHttpRequest",
    })
    
    response.raise_for_status()
    return response.json()  # [{ tagid, name }, ...]

tags = fetch_steam_tags()
for tag in tags:
    print(f"ID: {tag['tagid']}, Name: {tag['name']}")