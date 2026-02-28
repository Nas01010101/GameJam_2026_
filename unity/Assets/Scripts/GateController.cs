using UnityEngine;
using UnityEngine.InputSystem;

public class GateController : MonoBehaviour
{
    public Transform wordPositionOnGate; // empty object on top of gate
    public InteractionPromptUI promptUI;
    public PlayerMovement player;
    public bool playerInRange = false;

    /*
    private void OnTriggerEnter2D(Collider2D other)
    {
        if (other.CompareTag("Player"))
        {
            PlayerMovement player = other.GetComponent<PlayerMovement>();

            if (player.GetWord() != "")
            {
                GameObject wordObj = player.GetWordObject();

                wordObj.transform.SetParent(wordPositionOnGate);
                wordObj.transform.localPosition = Vector3.zero;

                player.ClearWord();

                Debug.Log("Word placed on gate!");
            }
        }
    }
    */
    private void OnTriggerEnter2D(Collider2D other)
    {
        if (other.CompareTag("Player"))
        {
            playerInRange = true;
            player = other.GetComponent<PlayerMovement>();
            promptUI.Show();
        }
    }

    private void OnTriggerExit2D(Collider2D other)
    {
        if (other.CompareTag("Player"))
        {
            playerInRange = false;
            player = null;
            promptUI.Hide();
        }
    }

    void Update()
    {
        if (playerInRange && Keyboard.current.fKey.wasPressedThisFrame)
        {
            TryPlaceWord();
        }
    }

    void TryPlaceWord()
    {
        if (player.GetWord() != "")
        {
            GameObject wordObj = player.GetWordObject();

            wordObj.transform.SetParent(wordPositionOnGate);
            wordObj.transform.localPosition = Vector3.zero;

            player.ClearWord();
        }
    }

}
