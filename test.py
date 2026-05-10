import google.generativeai as genai

def get_resident_evil_order_with_search():
    # 1. Paste your API key here
    api_key = "AIzaSyDHJYCyT6F3pk-LMLCeuME_aenmjS48G-A"
    
    if api_key == "YOUR_NEW_API_KEY_HERE":
        print("Please replace 'YOUR_NEW_API_KEY_HERE' with your actual Gemini API key.")
        return

    # 2. Configure the SDK
    genai.configure(api_key=api_key)

    # 3. Initialize the model with the correct Search Tool syntax
    model = genai.GenerativeModel(
        model_name='gemini-2.5-flash',
        tools=[{'google_search': {}}]
    )

    # 4. Define the prompt
    prompt = (
        "What is the recommended chronological playing order for the the last o series just give names? "
    )

    print("Sending prompt to Gemini API with Google Search enabled...\n")

    # 5. Generate the response
    try:
        response = model.generate_content(prompt)
        
        # 6. Print the result
        print("=== Resident Evil Playing Order (Live Search Enabled) ===")
        print(response.text)
        
        # Optional: Check if the model actually used search sources
        if response.candidates[0].grounding_metadata.search_entry_point:
            print("\n(Note: This response was grounded using Google Search results.)")
            
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    get_resident_evil_order_with_search()