using UnityEngine;

public class WordComponent : MonoBehaviour
{
    public string word = "OPEN";

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (other.CompareTag("Player"))
        {
           // PlayerController player = other.GetComponent<PlayerController>();
            //player.PickUpWord(word, gameObject);
        }
    }
}
