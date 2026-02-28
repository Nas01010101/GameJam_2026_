using UnityEngine;

[RequireComponent(typeof(Interactable))]
public class NPCChallenge : MonoBehaviour
{
    [Header("NPC Data")]
    public string characterName = "Emma";
    [TextArea(2, 4)]
    public string scenario = "Comment te sens-tu quand il pleut beaucoup dehors ?";
    
    [Header("Challenge Settings")]
    [Tooltip("The actual correct word the player needs to choose to unlock the gate")]
    public string targetWord = "triste";
    [Tooltip("Comma-separated list of fake words to show as choices")]
    public string fakeWords = "joie,colère,dégoût";

    private void Start()
    {
        // Auto-subscribe our Challenge trigger to the Interactable component
        var interactable = GetComponent<Interactable>();
        interactable.OnInteract.AddListener(TriggerChallenge);
    }

    public void TriggerChallenge()
    {
        // Don't pop up again if they already beat this NPC
        if (GameManager.Instance != null && GameManager.Instance.HasWord(targetWord))
        {
            Debug.Log($"[NPC] Already learned '{targetWord}', no need to talk again.");
            return;
        }

        Debug.Log($"[NPC] Triggering Challenge UI for {characterName}");
        
        // Find UI Manager and give it our data
        var ui = FindFirstObjectByType<ChallengeUIManager>();
        if (ui != null)
        {
            ui.OpenChallenge(characterName, scenario, targetWord, fakeWords.Split(','));
            
            // Optional: Freeze player movement here by finding the PlayerMovement script
            var player = GameObject.FindGameObjectWithTag("Player")?.GetComponent<PlayerMovement>();
            if (player != null) player.enabled = false;
        }
        else
        {
            Debug.LogError("[NPC] Could not find ChallengeUIManager in scene!");
        }
    }
}
