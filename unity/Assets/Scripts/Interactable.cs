using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.Events;

[RequireComponent(typeof(Collider2D))]
public class Interactable : MonoBehaviour
{
    [Header("Interaction Settings")]
    [Tooltip("Visual prompt shown when player is near (e.g., Press E)")]
    public GameObject promptIcon;
    public UnityEvent OnInteract;

    private bool isPlayerInRange = false;

    private void Start()
    {
        if (promptIcon != null)
            promptIcon.SetActive(false);

        // Ensure collider is a trigger
        Collider2D col = GetComponent<Collider2D>();
        if (col != null) col.isTrigger = true;
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (other.CompareTag("Player"))
        {
            isPlayerInRange = true;
            if (promptIcon != null) promptIcon.SetActive(true);
        }
    }

    private void OnTriggerExit2D(Collider2D other)
    {
        if (other.CompareTag("Player"))
        {
            isPlayerInRange = false;
            if (promptIcon != null) promptIcon.SetActive(false);
        }
    }

    private void Update()
    {
        // Simple polling for Input System 'E' key or Space
        if (isPlayerInRange && (Gamepad.current?.buttonSouth.wasPressedThisFrame == true || Keyboard.current?.spaceKey.wasPressedThisFrame == true || Keyboard.current?.eKey.wasPressedThisFrame == true))
        {
            Debug.Log($"[Interactable] Interacted with {gameObject.name}");
            OnInteract?.Invoke();
        }
    }
}
