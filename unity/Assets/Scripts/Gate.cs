using UnityEngine;

[RequireComponent(typeof(Collider2D))]
public class Gate : MonoBehaviour
{
    [Header("Progression Settings")]
    [Tooltip("The word the player must learn to open this gate (e.g., 'joie')")]
    public string requiredWord;

    private Collider2D solidCollider;
    private SpriteRenderer visualRenderer;

    private void Awake()
    {
        solidCollider = GetComponent<Collider2D>();
        visualRenderer = GetComponent<SpriteRenderer>();
    }

    private void Start()
    {
        // Listen for when player unlocks a word globally
        if (GameManager.Instance != null)
        {
            GameManager.Instance.OnWordUnlocked += CheckGate;
        }
    }

    private void OnDestroy()
    {
        // Always un-subscribe to prevent memory leaks!
        if (GameManager.Instance != null)
            GameManager.Instance.OnWordUnlocked -= CheckGate;
    }

    private void CheckGate(string word)
    {
        if (word == requiredWord)
        {
            OpenGate();
        }
    }

    private void OpenGate()
    {
        Debug.Log($"[Gate] Opened because player unlocked '{requiredWord}'!");

        // Remove the physical barrier so player can walk through
        if (solidCollider) solidCollider.enabled = false;

        // Visual fade out or destroy
        // For now, we'll just hide the sprite (you can do a particle effect later)
        if (visualRenderer) visualRenderer.enabled = false;

        // We can just destroy the actual game object after 1 second if not needed
        Destroy(gameObject, 1f);
    }
}
